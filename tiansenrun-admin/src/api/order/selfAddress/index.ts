import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { SelfGetAddressVO, SelfGetAddressForm, SelfGetAddressQuery } from '@/api/order/selfAddress/types';

/**
 * 查询自提点列表
 * @param query
 * @returns {*}
 */

export const listSelfGetAddress = (query?: SelfGetAddressQuery): AxiosPromise<SelfGetAddressVO[]> => {
    return request({
        url: '/api/admin/product/selfAddress/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询自提点详细
 * @param id
 */
export const getSelfGetAddress = (id: any) => {
    return request({
        url: '/api/admin/product/selfAddress/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增自提点
 * @param data
 */
export const addSelfGetAddress = (data: SelfGetAddressForm) => {
    return request({
        url: '/api/admin/product/selfAddress/add',
        method: 'post',
        data: data
    });
};

/**
 * 修改自提点
 * @param data
 */
export const updateSelfGetAddress = (data: SelfGetAddressForm) => {
    return request({
        url: '/api/admin/product/selfAddress/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除自提点
 * @param id
 */
export const delSelfGetAddress = (id: any) => {
    return request({
        url: '/api/admin/product/selfAddress/delete',
        method: 'post',
        data: { id }
    });
};
