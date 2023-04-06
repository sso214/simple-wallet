import Web3 from 'web3';
import { WalletBase, EncryptedKeystoreV3Json, TransactionReceipt } from 'web3-core';
import { STORAGE_KEY } from "./constant";
import { setLocalStorage, getLocalStorage } from './helper';

export default class SimpleWallet {
  private readonly web3: Web3 = {} as Web3;
  private readonly ADDRESS_LIST = getLocalStorage<string[]>(STORAGE_KEY.ADDRESS) || [];
  private getWallet: WalletBase = {} as WalletBase;

  constructor(rpc: string) {
    if (!rpc) {
      console.error("require key");
      return;
    }
    this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
  }

  async createWallet() {
    // 지갑 생성
    const { address, privateKey } = this.web3.eth.accounts.create();
    this.web3.eth.accounts.wallet.add({address,privateKey});
    this.getWallet = this.web3.eth.accounts.wallet;

    // accounts.wallet에 등록된 지갑 조회 후 퍼블릭 주소 추출
    const pickPublicAddress = this.getWallet[this.getWallet.length - 1].address;

    // public address 로컬스토리지 저장
    setLocalStorage(STORAGE_KEY.ADDRESS, pickPublicAddress);
    this.createAndEncryptKey();
    return pickPublicAddress;
  }

  private createAndEncryptKey() {
    // private key 암호화
    const keystore = this.web3.eth.accounts.encrypt(
      this.getWallet[this.getWallet.length - 1].privateKey,
      STORAGE_KEY.PASSWORD
    );

    // 암호화된 지갑 파일 다운로드
    const blob = new Blob([JSON.stringify(keystore)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `key-${new Date().getMilliseconds()}.json`;
    link.click();
  }

  async getBalance(address?: string): Promise<string> {
    try {
      const balanceWei = await this.web3.eth.getBalance(address || this.ADDRESS_LIST[0]);
      return this.web3.utils.fromWei(balanceWei, "ether");
    } catch {
      return "-";
    }
  }

  async sendTransaction(
    fromAddress: string,
    toAddress: string,
    sendAmount: string,
    privateKeyToStringify: string | ArrayBuffer | EncryptedKeystoreV3Json
  ): Promise<TransactionReceipt> {
    const nonce = await this.web3.eth.getTransactionCount(fromAddress); //fromAddress로부터 nonce 값 가져옴
    const gasPrice = await this.web3.eth.getGasPrice(); //네트워크 평균 가스 가격

    const tx = {
      nonce: parseInt(this.web3.utils.toHex(nonce), 16),
      from: fromAddress, //트랜잭션을 보내는 계정의 주소
      to: toAddress, //수신받는 계정의 주소
      value: this.web3.utils.toWei(sendAmount, "ether"), //얼마만큼 값을 보낼지 지정
      gasPrice, //트랜잭션에 필요한 가스 가격 (가격이 높을 수록 트랜잭션 처리 시간 빨라짐)
      gas: "21000", //트랜잭션에서 사용할 가스의 양 (일반적으로 이더 전송에는 21,000 가스가 필요함)
      data: "", //일반적으로 사용하지 않음 (보통 스마트 컨트랙트 호출 등 특수한 상황에서만 사용됨)
    };

    //트랜잭션 전송을 위해 암호화된 privateKey 파일을 사용자로부터 받아 decrypt를 이용해 복호화해 private key를 저장
    const { privateKey } = this.web3.eth.accounts.decrypt(
      privateKeyToStringify as EncryptedKeystoreV3Json,
      STORAGE_KEY.PASSWORD
    );

    let txReceipt: TransactionReceipt = {} as TransactionReceipt;
    try {
      //전송 거래 서명
      //트랜잭션 전송 전에는 트랜잭션에 서명을 해야 함.
      //트랜잭션 서명 : 송금자가 실제로 소유하고 있는 지갑에서 발생한 것임을 증명하는 과정. 지갑 소유자가 송금에 동의한 것으로 인정하고 블록체인 네트워크 상에서 전송 이뤄짐
      const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
      //전송 거래 발송
      //트랜잭션 전송 및 결과를 얻을 수 있음
      txReceipt = await this.web3.eth.sendSignedTransaction(signedTx?.rawTransaction || '');
    } catch (e) {
      console.error("failed transaction", e);
      alert(e);
    }
    console.log(":::SUCCESS:::", txReceipt);
    return txReceipt;
  }

  getAllAddress() {
    return this.ADDRESS_LIST;
  }
}
