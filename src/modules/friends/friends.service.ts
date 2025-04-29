import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { Friend } from './entities/friend.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'src/utils/pagination.util';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { User } from '../users/entities/user.entity';
import { ILike, In } from 'typeorm';
import { UserBasicInfoDto } from 'src/modules/users/dto/user-basic-info.dto';
import { TodayForecastService } from '../weather/service/today-forcast.service';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private usersService: UsersService,
    private todayForecastService: TodayForecastService,
  ) {}

  // 유저 검색 (친구 상태 포함)
  async searchUsers(
    requestingUserId: string,
    name: string,
    paginationDto: PaginationDto,
  ) {
    const query = this.usersService.findUserByName(name);
    query.leftJoinAndSelect('user.location', 'location');
    query.andWhere('user.id != :requestingUserId', { requestingUserId });

    const paginatedResult = await paginate(User, paginationDto, query);

    const searchedUsers = paginatedResult.data;
    const searchedUserIds = searchedUsers.map((user) => user.id);

    // 관계 정보를 저장할 Map (Key: 상대방 ID, Value: { status: string, senderId: string })
    const relationMap = new Map<string, { status: string; senderId: string }>();

    if (searchedUserIds.length > 0) {
      const relations = await this.friendRepository.find({
        where: [
          {
            sender: { id: requestingUserId },
            receiver: { id: In(searchedUserIds) },
          },
          {
            sender: { id: In(searchedUserIds) },
            receiver: { id: requestingUserId },
          },
        ],
        relations: ['sender', 'receiver'], // senderId 비교를 위해 관계 로드
      });

      relations.forEach((rel) => {
        const otherUserId =
          rel.sender.id === requestingUserId ? rel.receiver.id : rel.sender.id;
        // accepted 상태를 우선 적용
        if (!relationMap.has(otherUserId) || rel.status === 'accepted') {
          relationMap.set(otherUserId, {
            status: rel.status,
            senderId: rel.sender.id,
          });
        }
      });
    }

    // 결과를 { user: UserBasicInfoDto, status: string } 형태로 매핑
    const mappedData = searchedUsers.map((user) => {
      const basicInfo = UserBasicInfoDto.fromUser(user);
      let relationshipStatus: string;

      const relation = relationMap.get(user.id);
      if (relation) {
        if (relation.status === 'accepted') {
          relationshipStatus = 'FRIENDS';
        } else if (relation.status === 'pending') {
          relationshipStatus =
            relation.senderId === requestingUserId
              ? 'REQUEST_SENT'
              : 'REQUEST_RECEIVED';
        } else {
          relationshipStatus = 'NOT_FRIENDS';
        }
      } else {
        relationshipStatus = 'NOT_FRIENDS';
      }
      return { user: basicInfo, status: relationshipStatus };
    });

    return {
      items: mappedData,
      total: paginatedResult.total,
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

  // 친구로 등록된 전체 목록 조회 (DB 기반 날씨 정보 포함)
  async getFriendsList(userId: string, paginationDto: PaginationDto) {
    const whereCondition = [
      { sender: { id: userId }, status: 'accepted' as const },
      { receiver: { id: userId }, status: 'accepted' as const },
    ];

    const [friends, total] = await this.friendRepository.findAndCount({
      where: whereCondition,
      relations: ['sender', 'receiver', 'sender.location', 'receiver.location'],
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    const friendUsers = friends.map((friend) =>
      friend.sender.id === userId ? friend.receiver : friend.sender,
    );

    // 각 친구의 DB 날씨 정보 조회 및 매핑
    const mappedFriendsData = await Promise.all(
      friendUsers.map(async (user) => {
        const basicInfo = UserBasicInfoDto.fromUser(user);
        let weatherInfo: {
          temperature: number | null;
          sky: string | null;
        } | null = null;

        if (user.location && user.location.sido && user.location.gugun) {
          try {
            // DB에서 날씨 정보 조회하는 서비스 메서드 호출
            const forecastEntity =
              await this.todayForecastService.getForecastDataByRegionName(
                user.location.sido,
                user.location.gugun,
              );

            // forecastEntity가 존재하면 정보 추출
            if (forecastEntity) {
              weatherInfo = {
                temperature: forecastEntity.temperature ?? null,
                sky: forecastEntity.skyCondition ?? null, // DB에 저장된 skyCondition 값 사용
              };
            }
          } catch (error) {
            // NotFoundException 등 DB 조회 실패 시 경고 로그 남기고 weatherInfo는 null 유지
            if (error instanceof NotFoundException) {
              this.logger.warn(
                `친구(${user.id}) 지역 DB 날씨 정보 없음: ${user.location.sido} ${user.location.gugun}`,
              );
            } else {
              this.logger.error(
                `친구(${user.id}) DB 날씨 조회 오류: ${error.message}`,
              );
            }
          }
        } else {
          this.logger.debug(`친구(${user.id}) 위치 정보 없음.`);
        }

        return { user: basicInfo, weather: weatherInfo };
      }),
    );

    return {
      items: mappedFriendsData,
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
