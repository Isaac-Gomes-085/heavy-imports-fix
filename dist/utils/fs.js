"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFile = readFile;
exports.writeFile = writeFile;
const fs_1 = __importDefault(require("fs"));
function readFile(file) {
    return fs_1.default.readFileSync(file, "utf8");
}
function writeFile(file, content) {
    fs_1.default.writeFileSync(file, content, "utf8");
}
