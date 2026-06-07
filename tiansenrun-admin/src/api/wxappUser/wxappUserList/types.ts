export interface UserVO {
    /**
     * 用户ID
     */
    id: string | number;

    /**
     * 用户账号
     */
    account: string;

    /**
     * 用户昵称
     */
    nickName: string;

    /**
     * 头像地址
     */
    avatar: string;

    /**
     * 密码
     */
    password: string;

    /**
     * 手机号
     */
    mobile: string;

    /**
     * 邮箱
     */
    email: string;

    /**
     * 盐值
     */
    saltValue: string;

    /**
     * 公众号授权openId
     */
    openId: string | number;

    /**
     * 小程序授权openId
     */
    openIdx: string | number;

    /**
     * 帐号状态（0正常 1停用）
     */
    status: string;

    /**
     * 
     */
    totalAmount: number;

    /**
     * 
     */
    sex: number;

    /**
     * 
     */
    unionId: string | number;

    /**
     * 分享码
     */
    inviteCode: string;

    /**
     * 分享人分享码
     */
    parentInviteCode: string;

    /**
     * 分享码二维码
     */
    inviteQrCode: string;

}

export interface UserForm extends BaseEntity {
    /**
     * 用户ID
     */
    id?: string | number;

    /**
     * 用户账号
     */
    account?: string;

    /**
     * 用户昵称
     */
    nickName?: string;

    /**
     * 头像地址
     */
    avatar?: string;

    /**
     * 密码
     */
    password?: string;

    /**
     * 手机号
     */
    mobile?: string;

    /**
     * 邮箱
     */
    email?: string;

    /**
     * 盐值
     */
    saltValue?: string;

    /**
     * 公众号授权openId
     */
    openId?: string | number;

    /**
     * 小程序授权openId
     */
    openIdx?: string | number;

    /**
     * 帐号状态（0正常 1停用）
     */
    status?: string;

    /**
     * 
     */
    totalAmount?: number;

    /**
     * 
     */
    sex?: number;

    /**
     * 
     */
    unionId?: string | number;

    /**
     * 分享码
     */
    inviteCode?: string;

    /**
     * 分享人分享码
     */
    parentInviteCode?: string;

    /**
     * 分享码二维码
     */
    inviteQrCode?: string;

}

export interface UserQuery extends PageQuery {

    /**
     * 用户账号
     */
    account?: string;

    /**
     * 用户昵称
     */
    nickName?: string;

    /**
     * 头像地址
     */
    avatar?: string;

    /**
     * 密码
     */
    password?: string;

    /**
     * 手机号
     */
    mobile?: string;

    /**
     * 邮箱
     */
    email?: string;

    /**
     * 盐值
     */
    saltValue?: string;

    /**
     * 公众号授权openId
     */
    openId?: string | number;

    /**
     * 小程序授权openId
     */
    openIdx?: string | number;

    /**
     * 帐号状态（0正常 1停用）
     */
    status?: string;

    /**
     * 
     */
    totalAmount?: number;

    /**
     * 
     */
    sex?: number;

    /**
     * 
     */
    unionId?: string | number;

    /**
     * 分享码
     */
    inviteCode?: string;

    /**
     * 分享人分享码
     */
    parentInviteCode?: string;

    /**
     * 分享码二维码
     */
    inviteQrCode?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}
