import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tag } from './tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    const tag = this.tagRepository.create({
      ...dto,
      slug: dto.slug || this.generateSlug(dto.name),
    });

    return this.tagRepository.save(tag);
  }

  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({
      order: { postCount: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag #${id} not found`);
    }
    return tag;
  }

  async findByIds(ids: number[]): Promise<Tag[]> {
    if (!ids || ids.length === 0) return [];
    return this.tagRepository.findBy({ id: In(ids) });
  }

  async incrementPostCount(tagId: number): Promise<void> {
    await this.tagRepository.increment({ id: tagId }, 'postCount', 1);
  }

  async decrementPostCount(tagId: number): Promise<void> {
    await this.tagRepository.decrement({ id: tagId }, 'postCount', 1);
  }

  async update(id: number, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    if (dto.name) {
      tag.slug = this.generateSlug(dto.name);
    }

    Object.assign(tag, dto);
    return this.tagRepository.save(tag);
  }

  async remove(id: number): Promise<{ message: string }> {
    const tag = await this.findOne(id);
    await this.tagRepository.remove(tag);
    return { message: 'Tag deleted successfully' };
  }
}