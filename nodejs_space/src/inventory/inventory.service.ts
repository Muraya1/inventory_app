import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

const prisma = new PrismaClient();

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

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
    } catch (error) {
      this.logger.error(`Error fetching inventory: ${error.message}`);
      throw error;
    }
  }

  async create(createInventoryDto: CreateInventoryDto) {
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
    } catch (error) {
      this.logger.error(`Error creating inventory: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    try {
      // Check if item exists
      const existingItem = await prisma.inventoryitem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
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
    } catch (error) {
      this.logger.error(`Error updating inventory: ${error.message}`);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      // Check if item exists
      const existingItem = await prisma.inventoryitem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        throw new NotFoundException(`Inventory item with ID ${id} not found`);
      }

      await prisma.inventoryitem.delete({
        where: { id },
      });

      this.logger.log(`Inventory item deleted: ${existingItem.name} (${id})`);

      return { message: 'Inventory item deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting inventory: ${error.message}`);
      throw error;
    }
  }
}
