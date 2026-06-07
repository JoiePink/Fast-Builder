import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { VipVO, VipForm, VipQuery } from '@/api/wxappUser/wxappUserLevel/types';

/**
 * 查询vip信息列表
 * @param query
 * @returns {*}
 */

export const listVip = (query?: any) => {
    return request({
        url: '/api/admin/vip/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询vip信息详细
 * @param id
 */
export const getVip = (id: any) => {
    return request({
        url: '/api/admin/vip/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增vip信息
 * @param data
 */
export const addVip = (data: any) => {
    return request({
        url: '/api/admin/vip/add',
        method: 'post',
        data: data
    });
};

/**
 * 修改vip信息
 * @param data
 */
export const updateVip = (data: any) => {
    return request({
        url: '/api/admin/vip/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除vip信息
 * @param id
 */
export const delVip = (id: any) => {
    return request({
        url: '/api/admin/vip/delete',
        method: 'post',
        data: { id }
    });
};
