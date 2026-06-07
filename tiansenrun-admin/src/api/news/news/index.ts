import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { NewsVO, NewsForm, NewsQuery } from '@/api/news/news/types';

/**
 * 查询新闻列表
 * @param query
 * @returns {*}
 */

export const listNews = (query?: NewsQuery): AxiosPromise<NewsVO[]> => {
    return request({
        url: '/admin/news/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询新闻详细
 * @param id
 */
export const getNews = (id: string | number): AxiosPromise<NewsVO> => {
    return request({
        url: '/admin/news/' + id,
        method: 'get'
    });
};

/**
 * 新增新闻
 * @param data
 */
export const addNews = (data: NewsForm) => {
    return request({
        url: '/admin/news',
        method: 'post',
        data: data
    });
};

/**
 * 修改新闻
 * @param data
 */
export const updateNews = (data: NewsForm) => {
    return request({
        url: '/admin/news',
        method: 'put',
        data: data
    });
};

/**
 * 删除新闻
 * @param id
 */
export const delNews = (id: string | number | Array<string | number>) => {
    return request({
        url: '/admin/news/' + id,
        method: 'delete'
    });
};
