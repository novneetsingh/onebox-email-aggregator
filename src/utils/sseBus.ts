import EventEmitter from "events";

const sseBus = new EventEmitter();

// avoid memory warnings
sseBus.setMaxListeners(0);

export default sseBus;
