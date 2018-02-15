/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Vlad Martynenko <vladimir.martynenko.work@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { PROFILING_DEBOUNCE_TIME } from "./magic-values";
import { DataValidationResult } from "./helpers";

/* An object which stores all validator functions
    required to be executed during graphql request */
export const FieldValidationDefinitions: any = {};

/**
 * Builds errors array, using validation and global validation results
 *
 * @param validity - an object injected to request at the beginning of the http call
 * @param data - result of graphql call
 */
export function getResponseValidationResults(validity: any, data: any) {
    let globalValidationResults = validity.___globalValidationResults
        || [];
    data.errors =
        (data.errors || [])
            .concat(
                validity.___validationResults.map(
                    error => {
                        return {
                            message: error.message
                        };
                    })
            )
            .concat(
                globalValidationResults.map(error => {
                    return {
                        message: error.message
                    };
                })
            );
}

/**
 *  Grabs validation error from the graphql resolve function
 *  in case DataValidationResult type was returned as result.
 *
 * @param resolveOutput - output of the resolver function
 * @param validity - an object injected to request at the beginning of the http call
 *
 * @returns {any} - returns real resolve data output
 */
export function getResolveValidationResult(resolveOutput: any, validity: any) {
    let result = resolveOutput;

    if (resolveOutput instanceof DataValidationResult) {
        if (validity) {
            let {
                validationResults
            } = getValidationResults(validity);

            if (resolveOutput.errors && resolveOutput.errors.length) {
                Array.prototype.push.apply(
                    validationResults,
                    resolveOutput.errors
                );
            }
        }

        result = resolveOutput.data;
    }

    return result;
}

/**
 * Returns lists of graphql validation messages arrays from request object
 *
 * @param request - express request object
 * @returns {{validationResults: any; globalValidationResults: any}} -
 * list of validation result messages for both local and global validators
 */
export function getValidationResults(validity: any) {
    let validationResults = validity.___validationResults;

    if (!validationResults) {
        validity.___validationResults = [];
        validationResults = validity.___validationResults;
    }

    let globalValidationResults = validity.___globalValidationResults;

    return {
        validationResults,
        globalValidationResults
    }
}

/**
 * Return list of local and global validators
 *
 * @param field - field which will be validated
 * @param {string} parentTypeName - name of the parent object where field belongs to
 * @returns {{validators: T[]; globalValidators: (any | Array)}}
 * - list of local and global validator functions
 */
export function getValidators(field: any, parentTypeName: string) {
    let validators =
        (
            FieldValidationDefinitions['*']
            || []
        ).concat
        (
            FieldValidationDefinitions[field.type]
            || []
        ).concat
        (
            FieldValidationDefinitions[parentTypeName + ':' + field.name]
            || []
        )

    let globalValidators = FieldValidationDefinitions['$'] || [];

    return {
        validators,
        globalValidators
    }
}

/**
 * Modifies express response with validation results
 *
 * @param req - express request
 * @param data - response original data
 * @param profilingResultHandler - profiling function
 *
 * @returns {string} - response modified data
 */
export function applyValidation(
    req: any,
    data: any,
    profilingResultHandler: Function
) {
    let result = JSON.parse(data);

    if (result.data) {
        const validity = req.__graphQLValidity;
        getResponseValidationResults(validity, result);
        setTimeout(() => {
            const profilingData = validity.___profilingData;
            profilingResultHandler(profilingData, req.__graphQLValidityRequestId);
        }, PROFILING_DEBOUNCE_TIME);

        return JSON.stringify(result);
    }
}