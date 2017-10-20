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

export default (profilingResultHandler) => {
    /**
     * Middleware which will capture validation output and will add it to the original response
     *
     * @param server - Hapi server
     */
    return function graphQLValidityHapiMiddleware(server) {
        server.ext('onRequest', function (request, reply) {
            request.__graphQLValidity = {
                ___validationResults: [],
                ___globalValidationResults: undefined,
                ___profilingData: []
            };

            return reply.continue();
        });

        server.ext('onPreResponse', function (request, reply) {
            reply.request.response.source = applyValidation(
                reply.request,
                reply.request.response.source,
                profilingResultHandler.handler
            );
            return reply.continue();
        });
    }
}