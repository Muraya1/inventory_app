"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let InventoryService = InventoryService_1 = class InventoryService {
    logger = new common_1.Logger(InventoryService_1.name);
    async findAll() {
        try {
            const items = await prisma.inventoryitem.findMany({
                orderBy: { createdAt: 'desc' },
            });
            return items.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                stockLevel: item.stockLevel,
                unit: item.unit,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString(),
            }));
        }
        catch (error) {
            this.logger.error(`Error fetching inventory: ${error.message}`);
            throw error;
        }
    }
    async create(createInventoryDto) {
        try {
            const item = await prisma.inventoryitem.create({
                data: createInventoryDto,
            });
            this.logger.log(`Inventory item created: ${item.name} (${item.id})`);
            return {
                id: item.id,
                name: item.name,
                description: item.description,
                stockLevel: item.stockLevel,
                unit: item.unit,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Error creating inventory: ${error.message}`);
            throw error;
        }
    }
    async update(id, updateInventoryDto) {
        try {
            const existingItem = await prisma.inventoryitem.findUnique({
                where: { id },
            });
            if (!existingItem) {
                throw new common_1.NotFoundException(`Inventory item with ID ${id} not found`);
            }
            const item = await prisma.inventoryitem.update({
                where: { id },
                data: updateInventoryDto,
            });
            this.logger.log(`Inventory item updated: ${item.name} (${item.id})`);
            return {
                id: item.id,
                name: item.name,
                description: item.description,
                stockLevel: item.stockLevel,
                unit: item.unit,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString(),
            };
        }
        catch (error) {
            this.logger.error(`Error updating inventory: ${error.message}`);
            throw error;
        }
    }
    async delete(id) {
        try {
            const existingItem = await prisma.inventoryitem.findUnique({
                where: { id },
            });
            if (!existingItem) {
                throw new common_1.NotFoundException(`Inventory item with ID ${id} not found`);
            }
            await prisma.inventoryitem.delete({
                where: { id },
            });
            this.logger.log(`Inventory item deleted: ${existingItem.name} (${id})`);
            return { message: 'Inventory item deleted successfully' };
        }
        catch (error) {
            this.logger.error(`Error deleting inventory: ${error.message}`);
            throw error;
        }
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
//# sourceMappingURL=inventory.service.js.map