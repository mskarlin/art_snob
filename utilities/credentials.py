import base64
import logging
import os


def set_application_default_credentials(cred_loc='service_account.json'):
    b64_sa = os.environ.get('B64_ENCODED_SERVICE_ACCOUNT')
    if b64_sa:
        # decode b64 encoded json and write to file
        json_sa = base64.b64decode(b64_sa).decode('utf-8').replace('\n', '')
        with open(cred_loc, 'w') as f:
            f.write(json_sa)
        # set the env to use the new file here
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = cred_loc

    else:
        logging.info('No service account key found in environment, using user deaults.')

