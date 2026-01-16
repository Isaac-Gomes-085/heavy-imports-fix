"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClientComponent = isClientComponent;
exports.isHook = isHook;
function isClientComponent(code) {
    return /^["']use client["']/.test(code.trim());
}
function isHook(name) {
    return /^use[A-Z]/.test(name);
}
