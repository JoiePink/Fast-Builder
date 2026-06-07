import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { BannerVO, BannerForm, BannerQuery } from '@/api/banner/banner/types';

/**
 * 查询轮播图信息列表
 * @param query
 * @returns {*}
 */

export const listBanner = (query?: any)=> {
    return request({
        url: '/admin/banner/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询轮播图信息详细
 * @param id
 */
export const getBanner = (id: any) => {
    return request({
        url: '/admin/banner/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增轮播图信息
 * @param data
 */
export const addBanner = (data: any) => {
    return request({
        url: '/admin/banner/add',
        method: 'post',
        data: data
    });
};

/**
 * 修改轮播图信息
 * @param data
 */
export const updateBanner = (data: any) => {
    return request({
        url: '/admin/banner/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除轮播图信息
 * @param id
 */
export const delBanner = (id: any) => {
    return request({
        url: '/admin/banner/delete',
        method: 'post',
        data: { id }
    });
};
