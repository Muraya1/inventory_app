import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersService {
    private readonly logger;
    create(userId: string, createOrderDto: CreateOrderDto): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        items: {
            id: string;
            inventoryItemId: string;
            itemName: string;
            quantity: number;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
    findMyOrders(userId: string): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        items: {
            id: string;
            inventoryItemId: string;
            itemName: string;
            quantity: number;
        }[];
        createdAt: string;
        updatedAt: string;
    }[]>;
    findPendingOrders(): Promise<{
        id: string;
        userId: string;
        username: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        items: {
            id: string;
            inventoryItemId: string;
            itemName: string;
            quantity: number;
        }[];
        createdAt: string;
        updatedAt: string;
    }[]>;
    approveOrder(id: string): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        items: {
            id: string;
            inventoryItemId: string;
            itemName: string;
            quantity: number;
        }[];
        createdAt: string;
        updatedAt: string;
    }>;
}
