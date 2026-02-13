import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
export declare class InventoryService {
    private readonly logger;
    findAll(): Promise<{
        id: string;
        name: string;
        description: string;
        stockLevel: number;
        unit: string;
        createdAt: string;
        updatedAt: string;
    }[]>;
    create(createInventoryDto: CreateInventoryDto): Promise<{
        id: string;
        name: string;
        description: string;
        stockLevel: number;
        unit: string;
        createdAt: string;
        updatedAt: string;
    }>;
    update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<{
        id: string;
        name: string;
        description: string;
        stockLevel: number;
        unit: string;
        createdAt: string;
        updatedAt: string;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
