FROM public.ecr.aws/lambda/nodejs:14

COPY index.js package.json topDomains.js popularEmailDomains.js babel.config.json ${LAMBDA_TASK_ROOT}

RUN npm install

CMD [ "index.handler" ]