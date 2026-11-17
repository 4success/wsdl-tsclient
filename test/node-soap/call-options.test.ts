import test from "tape";
import { writeFileSync } from "fs";
import { parseAndGenerate } from "../../src";
import { Logger } from "../../src/utils/logger";
import { typecheck } from "../utils/tsc";

test("opções de chamada nos clientes e portas gerados", async t => {
    Logger.disabled();
    await parseAndGenerate("./test/resources/Dummy.wsdl", "./test/generated/call-options");
    const consumer = "./test/generated/call-options/consumer.ts";
    writeFileSync(consumer, `
import { DummyClient } from "./dummy/client";
import { DummyPortType } from "./dummy/ports/DummyPortType";
declare const client: DummyClient;
declare const port: DummyPortType;
client.DummyAsync({});
client.DummyAsync({}, { timeout: 1500, forceMTOM: true }, { "X-Test": "options" });
port.Dummy({}, () => undefined);
port.Dummy({}, () => undefined, { timeout: 1500 }, { "X-Test": "options" });
`);
    try {
        await typecheck(consumer);
        t.pass("assinaturas aceitam options/extraHeaders e preservam chamadas sem opções");
    } catch (error) {
        t.fail(String(error));
    }
    t.end();
});
