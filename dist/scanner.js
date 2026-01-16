"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanFiles = scanFiles;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const VALID_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
function scanFiles(dir) {
    const result = [];
    function walk(current) {
        if (!fs_1.default.existsSync(current))
            return;
        const stat = fs_1.default.statSync(current);
        if (stat.isDirectory()) {
            fs_1.default.readdirSync(current).forEach((f) => walk(path_1.default.join(current, f)));
        }
        else if (VALID_EXTENSIONS.some((ext) => current.endsWith(ext))) {
            result.push(current);
        }
    }
    walk(dir);
    return result;
}
