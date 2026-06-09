import { HostData } from '../models/host-data';
/**
 * Gets information about the current host environment
 * @param {string} framework The framework name to check version for
 * @param {string} reporterName The reporter name to check version for
 * @returns {HostData} Host information object
 */
export declare function getHostInfo(framework: string, reporterName: string): HostData;
