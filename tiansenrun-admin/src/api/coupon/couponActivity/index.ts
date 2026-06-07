import request from '@/utils/request';

/**
 * 查询优惠劵领取活动列表
 * @param query
 * @returns {*}
 */

export const listCouponActivity = (query?: any) => {
    return request({
        url: '/admin/coupon/activity/list',
        method: 'get',
        params: query
    });
};

/**
 * 查询优惠劵领取活动详细
 * @param id
 */
export const getCouponActivity = (id: any) => {
    return request({
        url: '/admin/coupon/activity/detail',
        method: 'get',
        params: { id }
    });
};

/**
 * 新增优惠劵领取活动
 * @param data
 */
export const addCouponActivity = (data: any) => {
    return request({
        url: '/admin/coupon/activity/publish',
        method: 'post',
        data: data
    });
};

/**
 * 修改优惠劵领取活动
 * @param data
 */
export const updateCouponActivity = (data: any) => {
    return request({
        url: '/admin/coupon/activity/update',
        method: 'post',
        data: data
    });
};

/**
 * 删除优惠劵领取活动
 * @param id
 */
export const delCouponActivity = (id: any) => {
    return request({
        url: '/admin/coupon/activity/delete',
        method: 'post',
        data: { id }
    });
};
