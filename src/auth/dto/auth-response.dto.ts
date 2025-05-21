import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Información básica del usuario',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'usuario@ejemplo.com',
      nombre: 'Juan',
    },
  })
  user: {
    id: string;
    email: string;
    nombre: string;
  };
}