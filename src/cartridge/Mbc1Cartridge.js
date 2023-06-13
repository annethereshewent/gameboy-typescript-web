"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mbc1Cartridge = void 0;
const CartridgeType_1 = require("./CartridgeType");
const MbcCartridge_1 = require("./MbcCartridge");
// see https://gbdev.io/pandocs/MBC1.html for most of the details on these
class Mbc1Cartridge extends MbcCartridge_1.MbcCartridge {
    constructor(gameDataView) {
        super(gameDataView);
        if (this.type === CartridgeType_1.CartridgeType.MBC1_PLUS_RAM_PLUS_BATTERY) {
            this.hasBattery = true;
        }
    }
    ramEnabled = false;
    mode = 0;
    romBankNumber = 1;
    ramBankNumber = 0;
    resetRam() {
        this.ramBytes.fill(0, 0, this.ramBytes.length - 1);
    }
    _read(address, readMethod) {
        if (address >= 0 && address <= 0x3fff) {
            return this.readFromBankZero(address, readMethod);
        }
        if (address >= 0x4000 && address <= 0x7fff) {
            return this.readFromBanksOneThrough7f(address, readMethod);
        }
        return this.readFromRam(address, readMethod);
    }
    readFromRam(address, readMethod) {
        if (!this.ramEnabled) {
            return 0xff;
        }
        const maskedAddress = (address - 0xa000) & 0b1111111111111;
        const ramRead = this.ramReadMethods[readMethod];
        if (this.mode === 0) {
            return ramRead(maskedAddress);
        }
        const actualAddress = (this.ramBankNumber << 13) + maskedAddress;
        return ramRead(actualAddress);
    }
    readFromBankZero(address, readMethod) {
        const read = this.readMethods[readMethod];
        const maskedAddress = address & 0b11111111111111;
        if (this.mode === 0) {
            return read(maskedAddress);
        }
        const actualAddress = ((this.ramBankNumber << 19) + maskedAddress) & (this.romSize - 1);
        return read(actualAddress);
    }
    readFromBanksOneThrough7f(address, readMethod) {
        const read = this.readMethods[readMethod];
        const bankNumber = (this.ramBankNumber << 5) + this.romBankNumber;
        const maskedAddress = address & 0b11111111111111;
        const actualAddress = ((bankNumber << 14) + maskedAddress) & (this.romSize - 1);
        return read(actualAddress);
    }
    _write(address, value, writeMethod) {
        if (this.isRamEnableRegister(address)) {
            this.ramEnabled = value === 0xa;
        }
        else if (this.isRomBankNumberRegister(address)) {
            this.romBankNumber = value === 0 ? 1 : value & 0b11111;
        }
        else if (this.isRamBankNumberRegister(address)) {
            this.ramBankNumber = value & 0b11;
        }
        else if (this.isBankingModeRegister(address)) {
            this.mode = value & 0b1;
        }
        else if (this.isRamAddress(address) && this.ramEnabled) {
            const maskedAddress = (address - 0xa000) & 0b1111111111111;
            const ramWrite = this.ramWriteMethods[writeMethod];
            if (this.mode === 0) {
                ramWrite(maskedAddress, value);
            }
            else {
                const actualAddress = (this.ramBankNumber << 13) + maskedAddress;
                ramWrite(actualAddress, value);
            }
        }
    }
    isRamEnableRegister(address) {
        return address >= 0 && address <= 0x1fff;
    }
    isRomBankNumberRegister(address) {
        return address >= 0x2000 && address <= 0x3fff;
    }
    isRamBankNumberRegister(address) {
        return address >= 0x4000 && address <= 0x5fff;
    }
    isBankingModeRegister(address) {
        return address >= 0x6000 && address <= 0x7fff;
    }
    isRamAddress(address) {
        return address >= 0xa000 && address <= 0xbfff;
    }
}
exports.Mbc1Cartridge = Mbc1Cartridge;
