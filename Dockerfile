FROM --platform=linux/amd64 node:18
WORKDIR /usr/src/app
COPY . .
RUN npm install
ENV PORT=8000
EXPOSE 8000
CMD [ "npm", "start" ]