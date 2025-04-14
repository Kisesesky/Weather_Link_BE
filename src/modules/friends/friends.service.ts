import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { Friend } from './entities/friend.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private usersService: UsersService,
  ) {}

  // 친구 검색
  async searchUsers(name: string) {
    return this.usersService.findUserByName(name);
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException('자기 자신에게 요청할 수 없습니다.');

    const sender = await this.usersService.findUserById(senderId);
    const receiver = await this.usersService.findUserById(receiverId);

    const existing = await this.friendRepository.findOne({
      where: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    if (existing) throw new BadRequestException('이미 친구 요청이 존재합니다.');

    const request = this.friendRepository.create({
      sender,
      receiver,
      status: 'pending',
    });
    return this.friendRepository.save(request);
  }

  // 친구 요청 수락 또는 거절
  async respondToFriendRequest(
    id: string,
    receiverId: string,
    accept: boolean,
  ) {
    const request = await this.friendRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });

    if (!request) throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    if (request.receiver.id !== receiverId)
      throw new ForbiddenException('권한이 없습니다.');
    if (request.status !== 'pending')
      throw new BadRequestException('이미 처리된 요청입니다.');

    request.status = accept ? 'accepted' : 'rejected';
    return this.friendRepository.save(request);
  }

  async getFriends(userId: string) {
    const accepted = await this.friendRepository.find({
      where: [
        { sender: { id: userId }, status: 'accepted' },
        { receiver: { id: userId }, status: 'accepted' },
      ],
      relations: ['sender', 'receiver'],
    });

    return accepted.map((f) =>
      f.sender.id === userId ? f.receiver : f.sender,
    );
  }

  // 보낸 친구 요청 목록
  async getSentRequests(userId: string) {
    return this.friendRepository.find({
      where: { sender: { id: userId }, status: 'pending' },
      relations: ['receiver'],
    });
  }

  // 받은 친구 요청 목록
  async getReceivedRequests(userId: string) {
    return this.friendRepository.find({
      where: { receiver: { id: userId }, status: 'pending' },
      relations: ['sender'],
    });
  }
}
