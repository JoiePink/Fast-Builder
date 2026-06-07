export interface CouponVO {
    /**
     * id
     */
    id: string | number;

    /**
     * 优惠价名称
     */
    couponName: string;

    /**
     * 优惠价图片
     */
    couponImg: string;

    /**
     * 优惠价类型 1抵扣 2折扣
     */
    couponType: number;

    /**
     * 使用要求金额
     */
    needAmount: number;

    /**
     * 抵扣金额
     */
    disAmount: number;

    /**
     * 折扣值
     */
    disValue: number;

    /**
     * 发放次数
     */
    publishCount: number;

    /**
     * 发放数量
     */
    publishTotal: number;

}

export interface CouponForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * 优惠价名称
     */
    couponName?: string;

    /**
     * 优惠价图片
     */
    couponImg?: string;

    /**
     * 优惠价类型 1抵扣 2折扣
     */
    couponType?: number;

    /**
     * 使用要求金额
     */
    needAmount?: number;

    /**
     * 抵扣金额
     */
    disAmount?: number;

    /**
     * 折扣值
     */
    disValue?: number;

    /**
     * 发放次数
     */
    publishCount?: number;

    /**
     * 发放数量
     */
    publishTotal?: number;

}

export interface CouponQuery extends PageQuery {

    /**
     * 优惠价名称
     */
    couponName?: string;

    /**
     * 优惠价图片
     */
    couponImg?: string;

    /**
     * 优惠价类型 1抵扣 2折扣
     */
    couponType?: number;

    /**
     * 使用要求金额
     */
    needAmount?: number;

    /**
     * 抵扣金额
     */
    disAmount?: number;

    /**
     * 折扣值
     */
    disValue?: number;

    /**
     * 发放次数
     */
    publishCount?: number;

    /**
     * 发放数量
     */
    publishTotal?: number;

    /**
     * 日期范围参数
     */
    params?: any;
}
