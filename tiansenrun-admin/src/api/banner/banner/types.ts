export interface BannerVO {
    /**
     * 轮播图ID
     */
    id: string | number;

    /**
     * 图片链接
     */
    imageLink: string;

    /**
     * 排序
     */
    orders: number;

    /**
     * 状态 0正常 1使用
     */
    status: number;

    /**
     * 跳转链接
     */
    jumpLink: string;

    /**
     * 轮播图类型
     */
    type: string;

}

export interface BannerForm extends BaseEntity {
    /**
     * 轮播图ID
     */
    id?: string | number;

    /**
     * 图片链接
     */
    imageLink?: string;

    /**
     * 排序
     */
    orders?: number;

    /**
     * 状态 0正常 1使用
     */
    status?: number;

    /**
     * 跳转链接
     */
    jumpLink?: string;

    /**
     * 轮播图类型
     */
    type?: string;

}

export interface BannerQuery extends PageQuery {

    /**
     * 图片链接
     */
    imageLink?: string;

    /**
     * 排序
     */
    orders?: number;

    /**
     * 状态 0正常 1使用
     */
    status?: number;

    /**
     * 跳转链接
     */
    jumpLink?: string;

    /**
     * 轮播图类型
     */
    type?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}
