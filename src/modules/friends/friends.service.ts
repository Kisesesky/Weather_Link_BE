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
import { UserBasicInfoDto } from 'src/modules/users/dto/user-basic-info.dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private usersService: UsersService,
  ) {}

  // 유저 검색
  async searchUsers(
    name: string,
    paginationDto: PaginationDto,
    currentUserId: string,
  ) {
    const query = this.usersService.findUserByName(name);
    query.leftJoinAndSelect('user.location', 'location');
    // 로그인한 유저 자신 제외
    query.andWhere('user.id != :currentUserId', { currentUserId });

    // 친구 또는 친구 요청 중인 목록 조회
    const relations = await this.friendRepository.find({
      where: [
        { sender: { id: currentUserId } },
        { receiver: { id: currentUserId } },
      ],
    });

    const relatedUserIds = new Set<string>();
    relations.forEach((rel) => {
      if (rel.sender?.id === currentUserId && rel.receiver?.id) {
        relatedUserIds.add(rel.receiver.id);
      } else if (rel.receiver?.id === currentUserId && rel.sender?.id) {
        relatedUserIds.add(rel.sender.id);
      }
    });

    // 검색 결과에서 제외
    const paginatedResult = await paginate(User, paginationDto, query);
    const filtered = paginatedResult.data.filter(
      (user) => !relatedUserIds.has(user.id),
    );
    const mappedData = filtered.map((user) => UserBasicInfoDto.fromUser(user));

    return {
      data: mappedData,
      total: filtered.length,
      take: paginationDto.take,
      skip: paginationDto.skip,
    };
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException('자기 자신에게 요청할 수 없습니다.');

    // sender와 receiver 정보를 location 포함하여 조회 (findUserById 사용)
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
    // 저장된 Friend 엔티티를 받음
    const savedRequest = await this.friendRepository.save(request);

    // UserBasicInfoDto를 사용하여 응답 데이터 생성
    const responseData = {
      id: savedRequest.id,
      status: savedRequest.status,
      createdAt: savedRequest.createdAt,
      sender: UserBasicInfoDto.fromUser(sender),
      receiver: UserBasicInfoDto.fromUser(receiver),
    };

    // 구성된 응답 데이터 객체 반환
    return responseData;
  }

  // 친구 요청 수락 또는 거절
  async respondToFriendRequest(
    id: string,
    receiverId: string,
    accept: boolean,
  ) {
    const request = await this.friendRepository.findOne({
      where: { id },
      relations: ['sender', 'sender.location', 'receiver', 'receiver.location'],
    });

    if (!request) throw new NotFoundException('친구 요청을 찾을 수 없습니다.');
    if (request.receiver.id !== receiverId)
      throw new ForbiddenException('권한이 없습니다.');
    if (request.status !== 'pending')
      throw new BadRequestException('이미 처리된 요청입니다.');

    request.status = accept ? 'accepted' : 'rejected';
    const savedRequest = await this.friendRepository.save(request);

    // UserBasicInfoDto를 사용하여 응답 데이터 생성
    const responseData = {
      id: savedRequest.id,
      status: savedRequest.status,
      createdAt: savedRequest.createdAt,
      sender: UserBasicInfoDto.fromUser(savedRequest.sender),
      receiver: UserBasicInfoDto.fromUser(savedRequest.receiver),
    };

    return responseData;
  }

  // 보낸 친구 요청 목록
  async getSentRequests(userId: string) {
    const requests = await this.friendRepository.find({
      where: { sender: { id: userId }, status: 'pending' },
      // receiver와 receiver의 location 정보 로드
      relations: ['receiver', 'receiver.location'],
    });

    // 필요한 필드만 선택하여 데이터 매핑
    const mappedRequests = requests.map((req) => ({
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      // UserBasicInfoDto를 사용하여 receiver 정보 매핑
      receiver: req.receiver ? UserBasicInfoDto.fromUser(req.receiver) : null,
    }));

    // 매핑된 요청 목록 반환
    return mappedRequests;
  }

  // 받은 친구 요청 목록
  async getReceivedRequests(userId: string) {
    const requests = await this.friendRepository.find({
      where: { receiver: { id: userId }, status: 'pending' },
      // sender와 sender의 location 정보 로드
      relations: ['sender', 'sender.location'],
    });

    // UserBasicInfoDto를 사용하여 데이터 매핑
    const mappedRequests = requests.map((req) => ({
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      // UserBasicInfoDto를 사용하여 sender 정보 매핑
      sender: req.sender ? UserBasicInfoDto.fromUser(req.sender) : null,
    }));
    return mappedRequests;
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
      // sender와 receiver의 location 정보도 함께 로드
      relations: ['sender', 'receiver', 'sender.location', 'receiver.location'],
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    // 조회된 Friend 관계 목록에서 친구 User 객체만 추출
    const friendUsers = friends.map((friend) =>
      friend.sender.id === userId ? friend.receiver : friend.sender,
    );

    // UserBasicInfoDto를 사용하여 데이터 매핑 (람다 함수 사용)
    const mappedFriendsData = friendUsers.map((user) =>
      UserBasicInfoDto.fromUser(user),
    );

    // 최종 결과 객체 반환
    return {
      data: mappedFriendsData,
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
      // sender와 receiver의 location 정보 로드
      relations: ['sender', 'receiver', 'sender.location', 'receiver.location'],
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    // 친구 User 객체 추출 및 UserBasicInfoDto로 매핑 (람다 함수 사용)
    const mappedData = friends.map((friend) =>
      friend.sender.id === userId
        ? UserBasicInfoDto.fromUser(friend.receiver)
        : UserBasicInfoDto.fromUser(friend.sender),
    );

    return {
      data: mappedData,
      total,
      take: paginationDto.take,
      skip: paginationDto.skip,
    };
  }

  // 친구 목록에서 특정 친구 삭제
  async removeFriend(userId: string, friendId: string) {
    const friend = await this.friendRepository.findOne({
      where: [
        {
          sender: { id: userId },
          receiver: { id: friendId },
          status: 'accepted',
        },
        {
          sender: { id: friendId },
          receiver: { id: userId },
          status: 'accepted',
        },
      ],
    });

    if (!friend) throw new NotFoundException('친구 관계를 찾을 수 없습니다.');

    await this.friendRepository.remove(friend);
  }
}
