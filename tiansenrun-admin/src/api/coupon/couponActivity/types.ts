export interface CouponActivityVO {
    /**
     * id
     */
    id: string | number;

    /**
     * 优惠劵ID
     */
    couponId: string | number;

    /**
     * 总发布限量
     */
    limitTotal: number;

    /**
     * 开始时间
     */
    startTime: string;

    /**
     * 过期时间
     */
    expireTime: string;

    /**
     * 活动详情
     */
    activityDetail: string;

    /**
     * 状态（0正常 1停用 2过期）
     */
    status: string;

}

export interface CouponActivityForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * 优惠劵ID
     */
    couponId?: string | number;

    /**
     * 总发布限量
     */
    limitTotal?: number;

    /**
     * 开始时间
     */
    startTime?: string;

    /**
     * 过期时间
     */
    expireTime?: string;

    /**
     * 活动详情
     */
    activityDetail?: string;

    /**
     * 状态（0正常 1停用 2过期）
     */
    status?: string;

}

export interface CouponActivityQuery extends PageQuery {

    /**
     * 优惠劵ID
     */
    couponId?: string | number;

    /**
     * 总发布限量
     */
    limitTotal?: number;

    /**
     * 开始时间
     */
    startTime?: string;

    /**
     * 过期时间
     */
    expireTime?: string;

    /**
     * 活动详情
     */
    activityDetail?: string;

    /**
     * 状态（0正常 1停用 2过期）
     */
    status?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}
