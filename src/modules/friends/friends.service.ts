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
import { paginate } from 'src/utils/pagination.util';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { User } from '../users/entities/user.entity';
import { ILike } from 'typeorm';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private usersService: UsersService,
  ) {}

  // 유저 검색
  async searchUsers(name: string, paginationDto: PaginationDto) {
    const query = this.usersService.findUserByName(name);
    return paginate(User, paginationDto, query);
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException('자기 자신에게 요청할 수 없습니다.');

    const sender = await this.usersService.findUserById(senderId);
    const receiver = await this.usersService.findUserById(receiverId);

    // 유저 간 친구 관계 확인
    const existingRelations = await this.friendRepository.find({
      where: [
        { sender: { id: senderId }, receiver: { id: receiverId } },
        { sender: { id: receiverId }, receiver: { id: senderId } },
      ],
    });

    // 이미 친구인 경우
    const isAlreadyFriend = existingRelations.some(
      (relation) => relation.status === 'accepted',
    );
    if (isAlreadyFriend) {
      throw new BadRequestException('이미 친구로 등록된 사용자입니다.');
    }

    // 진행중인 친구 요청이 있는 경우
    const isPending = existingRelations.some(
      (relation) => relation.status === 'pending',
    );
    if (isPending) {
      throw new BadRequestException('이미 친구 요청이 존재합니다.');
    }

    // 새로운 요청 생성
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

  // 친구로 등록된 전체 목록 조회
  async getFriendsList(userId: string, paginationDto: PaginationDto) {
    const whereCondition = [
      {
        sender: { id: userId },
        status: 'accepted' as const,
      },
      {
        receiver: { id: userId },
        status: 'accepted' as const,
      },
    ];

    const [friends, total] = await this.friendRepository.findAndCount({
      where: whereCondition,
      relations: ['sender', 'receiver'],
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    return {
      data: friends.map((friend) =>
        friend.sender.id === userId ? friend.receiver : friend.sender,
      ),
      total,
      take: paginationDto.take,
      skip: paginationDto.skip,
    };
  }

  // 친구로 등록된 목록 중 닉네임 검색
  async searchFriends(
    userId: string,
    name: string,
    paginationDto: PaginationDto,
  ) {
    const whereCondition = [
      {
        sender: { id: userId },
        receiver: { name: ILike(`%${name}%`) },
        status: 'accepted' as const,
      },
      {
        receiver: { id: userId },
        sender: { name: ILike(`%${name}%`) },
        status: 'accepted' as const,
      },
    ];

    const [friends, total] = await this.friendRepository.findAndCount({
      where: whereCondition,
      relations: ['sender', 'receiver'],
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    return {
      data: friends.map((friend) =>
        friend.sender.id === userId ? friend.receiver : friend.sender,
      ),
      total,
      take: paginationDto.take,
      skip: paginationDto.skip,
    };
  }

  // 친구 목록에서 특정 친구 삭제
  async removeFriend(userId: string, friendId: string) {
    const friend = await this.friendRepository.findOne({
      where: {
        sender: { id: userId },
        receiver: { id: friendId },
      },
    });

    if (!friend) throw new NotFoundException('친구를 찾을 수 없습니다.');

    await this.friendRepository.remove(friend);
  }
}
