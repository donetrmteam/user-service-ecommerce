import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';

@Controller()
export class AuthTcpController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() data: { loginUserDto: LoginUserDto }) {
    return this.authService.login(data.loginUserDto);
  }

  @MessagePattern({ cmd: 'validate_token' })
  async validateToken(@Payload() token: string) {
    try {
      return this.authService.validateToken(token);
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
} 