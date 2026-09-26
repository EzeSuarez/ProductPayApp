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
  DELIVERY_REPOSITORY_PORT,
  DeliveryRepositoryPort,
} from '../../application/ports/delivery.repository.port';

@ApiTags('Deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(
    @Inject(DELIVERY_REPOSITORY_PORT)
    private readonly deliveryRepository: DeliveryRepositoryPort
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Find delivery order and shipment status by UUID' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Delivery details found' })
  @ApiResponse({ status: 404, description: 'Delivery not found' })
  async getDeliveryById(@Param('id') id: string) {
    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: delivery.toJSON(),
    };
  }

  @Get('by-customer/:customerId')
  @ApiOperation({ summary: 'List deliveries associated with a specific customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'List of customer deliveries' })
  async getDeliveriesByCustomerId(@Param('customerId') customerId: string) {
    const deliveries = await this.deliveryRepository.findByCustomerId(customerId);
    return {
      statusCode: HttpStatus.OK,
      data: deliveries.map((d) => d.toJSON()),
      count: deliveries.length,
    };
  }
}
