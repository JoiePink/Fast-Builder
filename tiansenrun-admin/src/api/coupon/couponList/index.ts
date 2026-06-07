import request from '@/utils/request';

/**
 * 查询优惠劵信息列表
 * @param query
 * @returns {*}
 */

export const listCoupon = (query?: any) => {
    return request({
        url: '/admin/coupon/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询优惠劵信息详细
 * @param id
 */
export const getCoupon = (id: any) => {
    return request({
        url: '/admin/coupon/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增优惠劵信息
 * @param data
 */
export const addCoupon = (data: any) => {
    return request({
        url: '/admin/coupon/add',
        method: 'post',
        data: data
    });
};

/**
 * 修改优惠劵信息
 * @param data
 */
export const updateCoupon = (data: any) => {
    return request({
        url: '/admin/coupon/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除优惠劵信息
 * @param id
 */
export const delCoupon = (id: any) => {
    return request({
        url: '/admin/coupon/delete',
        method: 'post',
        data: { id }
    });
};
