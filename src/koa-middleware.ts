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

import { applyValidation } from "./validation";

export default (profilingResultHandler: { handler: (...args: any[]) => any }) => {
    /**
     * Middleware which will capture validation output and will add it to the original response
     *
     * @param ctx - koa context
     * @param next - next call
     */
    return async function graphQLValidityKoaMiddleware(
        ctx: any,
        next: (...args: any[]) => any
    ) {
        let { req } = ctx;
        try {
            req.__graphQLValidity = {
                ___validationResults: [],
                ___globalValidationResultsCaptured: false,
                ___profilingData: []
            };

            await next();

            ctx.body = applyValidation(
                req,
                ctx.body,
                profilingResultHandler.handler
            );
        }
        catch (err) {
            console.error(err);
            await next();
        }
    }
}