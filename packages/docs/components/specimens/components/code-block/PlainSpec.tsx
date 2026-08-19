import { CodeBlock } from '@dreamlake/uikit'

// A traceback pasted into a log viewer: no filename to label it with, lines far
// too long to scroll sideways through, and more of them than the panel should
// grow to fit.
const traceback = `Traceback (most recent call last):
  File "/opt/dreamlake/pipeline/ingest.py", line 214, in _upload_chunk
    resp = self._session.put(url, data=buf, timeout=self.timeout, headers={"content-type": "application/octet-stream", "x-amz-content-sha256": digest})
  File "/usr/lib/python3.12/site-packages/requests/sessions.py", line 649, in put
    return self.request("PUT", url, data=data, **kwargs)
  File "/usr/lib/python3.12/site-packages/requests/adapters.py", line 507, in send
    raise ConnectTimeout(e, request=request)
requests.exceptions.ConnectTimeout: HTTPSConnectionPool(host='s3.us-west-2.amazonaws.com', port=443): Max retries exceeded with url: /dreamlake-chunks/9f2c41e8b7.ts (Caused by ConnectTimeoutError(<urllib3.connection.HTTPSConnection object at 0x7f3a2c1d8e50>, 'Connection to s3.us-west-2.amazonaws.com timed out. (connect timeout=15)'))
`

export const PlainSpec = () => <CodeBlock value={traceback} header={false} maxHeight={200} wrap />
