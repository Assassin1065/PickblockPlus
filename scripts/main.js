import { ItemStack, Player, system, world } from "@minecraft/server";

const playerCooldowns = new Map();
const playerMessageCooldowns = new Map();
const COOLDOWN_TICKS = 10;
const MESSAGE_COOLDOWN_TICKS = 20;

function sendMessageWithCooldown(player, message) {
    const currentTime = system.currentTick;
    const lastMessageTime = playerMessageCooldowns.get(player.id) || 0;
    if (currentTime - lastMessageTime >= MESSAGE_COOLDOWN_TICKS) {
        player.sendMessage(message);
        playerMessageCooldowns.set(player.id, currentTime);
    }
}

world.beforeEvents.itemUseOn.subscribe((data) => {
    const { itemStack, source, block } = data;
    if (!(source instanceof Player)) return;
    if (itemStack.typeId !== "pickblock:debug_stick") return;
    if (!source.hasTag("admin")) {
        sendMessageWithCooldown(source, "[§l§bPickblock+§r] Unauthorized use, do /tag @s add admin to use this item.");
        return;
    }
    if (source.getGameMode() !== "creative") {
        sendMessageWithCooldown(source, "[§l§bPickblock+§r] Do /gamemode c to pickblock this block");
        return;
    }

    const currentTime = system.currentTick;
    const lastActionTime = playerCooldowns.get(source.id) || 0;
    if (currentTime - lastActionTime < COOLDOWN_TICKS) {
        sendMessageWithCooldown(source, "[§l§bPickblock+§r] You must wait before performing this action again.");
        return;
    }

    playerCooldowns.set(source.id, currentTime);
    const container = source.getComponent("inventory")?.container;
    if (!container) return;

    data.cancel = true;

    const blockItemStack = block.getItemStack(1, true);
    if (blockItemStack) {
        system.run(() => {
            container.addItem(blockItemStack);
            source.sendMessage(`[§l§bPickblock+§r] You pickblocked the block:§a ${block.typeId}`);
        });
    }
});
