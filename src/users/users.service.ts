import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: createUserDto.email } 
      });
      
      if (existingUser) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }

      const user = this.usersRepository.create({
        ...createUserDto,
        password: await this.hashPassword(createUserDto.password),
      });

      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    
    const token = uuidv4();
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 24);
    
    user.tokenRecuperacion = token;
    user.expiracionTokenRecuperacion = expiracion;
    await this.usersRepository.save(user);
    
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ 
      where: { tokenRecuperacion: token } 
    });
    
    if (!user) {
      throw new NotFoundException('Token de recuperación inválido');
    }
    
    const now = new Date();
    if (user.expiracionTokenRecuperacion < now) {
      throw new ConflictException('El token de recuperación ha expirado');
    }
    
    user.password = await this.hashPassword(newPassword);
    user.tokenRecuperacion = '';
    user.expiracionTokenRecuperacion = new Date(0);
    await this.usersRepository.save(user);
    
    return true;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      if (user && await bcrypt.compare(password, user.password)) {
        return user;
      }
      throw new NotFoundException('Invalid email or password');
    } catch (error) {
      throw new InternalServerErrorException('Error al validar el usuario');
    }
  }
}