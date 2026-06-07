export interface NewsVO {
    /**
     * id
     */
    id: string | number;

    /**
     * 新闻标题
     */
    title: string;

    /**
     * 作者
     */
    authorName: string;

    /**
     * 新闻副标题
     */
    subTitle: string;

    /**
     * 时间
     */
    newsTime: string;

    /**
     * 详情
     */
    detail: string;

    /**
     * 状态（0正常 1锁定）
     */
    status: string;

}

export interface NewsForm extends BaseEntity {
    /**
     * id
     */
    id?: string | number;

    /**
     * 新闻标题
     */
    title?: string;

    /**
     * 作者
     */
    authorName?: string;

    /**
     * 新闻副标题
     */
    subTitle?: string;

    /**
     * 时间
     */
    newsTime?: string;

    /**
     * 详情
     */
    detail?: string;

    /**
     * 状态（0正常 1锁定）
     */
    status?: string;

}

export interface NewsQuery extends PageQuery {

    /**
     * 新闻标题
     */
    title?: string;

    /**
     * 作者
     */
    authorName?: string;

    /**
     * 新闻副标题
     */
    subTitle?: string;

    /**
     * 时间
     */
    newsTime?: string;

    /**
     * 状态（0正常 1锁定）
     */
    status?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}
