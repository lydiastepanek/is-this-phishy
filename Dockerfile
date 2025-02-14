FROM public.ecr.aws/lambda/nodejs:22

COPY index.js package.json package-lock.json babel.config.json ${LAMBDA_TASK_ROOT}
COPY topDomains ${LAMBDA_TASK_ROOT}/topDomains
COPY popularEmailDomains ${LAMBDA_TASK_ROOT}/popularEmailDomains

RUN npm install --only=production

CMD [ "index.handler" ]