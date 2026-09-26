import {
  Controller,
  Get,
  Param,
  Inject,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  CUSTOMER_REPOSITORY_PORT,
  CustomerRepositoryPort,
} from '../../application/ports/customer.repository.port';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Find customer profile by UUID' })
  @ApiParam({ name: 'id', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer profile found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerById(@Param('id') id: string) {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: customer.toJSON(),
    };
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Find customer profile by email' })
  @ApiParam({ name: 'email', description: 'Customer email address' })
  @ApiResponse({ status: 200, description: 'Customer profile found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerByEmail(@Param('email') email: string) {
    const customer = await this.customerRepository.findByEmail(email);
    if (!customer) {
      throw new NotFoundException(`Customer with email ${email} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: customer.toJSON(),
    };
  }
}
