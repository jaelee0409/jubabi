import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

// configure once
dayjs.extend(relativeTime);
dayjs.locale("ko");

export default dayjs;
