import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller()
export class UsersTcpController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'create_user' })
  async create(@Payload() data: { createUserDto: CreateUserDto }) {
    return this.usersService.create(data.createUserDto);
  }

  @MessagePattern({ cmd: 'get_user_profile' })
  async getProfile(@Payload() data: { userId: string }) {
    return this.usersService.findOne(data.userId);
  }

  @MessagePattern({ cmd: 'find_all_users' })
  async findAll() {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(@Payload() data: { id: string; updateUserDto: UpdateUserDto }) {
    return this.usersService.update(data.id, data.updateUserDto);
  }

  @MessagePattern({ cmd: 'remove_user' })
  async remove(@Payload() data: { id: string }) {
    return this.usersService.remove(data.id);
  }

  @MessagePattern({ cmd: 'request_password_reset' })
  async requestPasswordReset(@Payload() data: { email: string }) {
    return this.usersService.generatePasswordResetToken(data.email);
  }

  @MessagePattern({ cmd: 'reset_password' })
  async resetPassword(@Payload() data: { resetPasswordDto: ResetPasswordDto }) {
    return this.usersService.resetPassword(
      data.resetPasswordDto.token,
      data.resetPasswordDto.newPassword
    );
  }
}