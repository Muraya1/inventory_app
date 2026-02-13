import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        token: string;
        user: {
            id: string;
            username: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    }>;
}
