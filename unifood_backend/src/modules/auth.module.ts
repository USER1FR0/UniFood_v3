import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
//import {PassportModule} from '@nestjs/passport';
import { authController } from 'src/controllers/auth.controller';
import { authService } from 'src/services/auth.service';
import { PrismaModule } from './prisma.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET_KEY,
            signOptions:{ expiresIn:'3600s' }
        }),
        PrismaModule
    ],
    controllers: [authController],
    providers: [authService],
    exports: [authService, JwtModule],
})

export class authModule {}