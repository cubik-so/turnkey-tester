import { TurnkeySigner } from '@turnkey/solana';
import { TurnkeyClient } from '@turnkey/http';
import * as dotenv from 'dotenv';
import { ApiKeyStamper } from '@turnkey/api-key-stamper';
import { web3 } from '@coral-xyz/anchor';
dotenv.config();

const main = async () => {
  const organizationId = process.env.ORG_ID || '';
  const connection = new web3.Connection(process.env.RPC!);

  const turnkeyClient = new TurnkeyClient(
    { baseUrl: process.env.API_URL! },
    new ApiKeyStamper({
      apiPublicKey: process.env.API_PUB_KEY!,
      apiPrivateKey: process.env.API_PRIVATE_KEY!,
    })
  );

  const turnkeySigner = new TurnkeySigner({
    organizationId,
    client: turnkeyClient,
  });
  const fromAddress = 'Dm36Byj54t4kQLc1qAUfY3r2wmp8ezbZdzjdFeibgPPm';
  const toAddress = process.env.TO_ADDRESS!;

  const fromKey = new web3.PublicKey(fromAddress);
  const toKey = new web3.PublicKey(toAddress);

  const transferTransaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: fromKey,
      toPubkey: toKey,
      lamports: web3.LAMPORTS_PER_SOL * 0.01,
    })
  );
  const { blockhash } = await connection.getLatestBlockhash();
  // Get a recent block hash
  transferTransaction.recentBlockhash = blockhash;
  // Set the signer
  transferTransaction.feePayer = fromKey;

  await turnkeySigner.addSignature(transferTransaction, fromAddress);

  const verified = transferTransaction.verifySignatures();

  if (!verified) {
    throw new Error('unable to verify transaction signatures');
  }

  const transactionHash = await connection.sendRawTransaction(
    transferTransaction.serialize(),
    { preflightCommitment: 'confirmed' }
  );
  console.log('Transaction hash:', transactionHash);
};

main();
