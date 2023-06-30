import moment from "moment/moment";
import winston, {format} from "winston";
import combine = format.combine;
import label = format.label;
import timestamp = format.timestamp;
import printf = format.printf;

const LOGGER_FORMAT = combine(
    label({label: 'server'}),
    timestamp({
        format: () => moment().format('YYYY-MM-DD HH:mm:ss')
    }),
    printf(({level, message, label, timestamp}) => {
        return `${timestamp} [${label}] ${level}: ${message}`;
    })
);
export const logger = winston.createLogger({
    level: 'debug',
    format: LOGGER_FORMAT,
    defaultMeta: {service: 'user-service'},
    transports: [],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: LOGGER_FORMAT,
    }));
}
