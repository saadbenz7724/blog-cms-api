import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create({
      ...dto,
      slug: dto.slug || this.generateSlug(dto.name),
    });

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name) {
      category.slug = this.generateSlug(dto.name);
    }

    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}