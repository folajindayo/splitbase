import { eventEmitter } from "./eventEmitter";
import { notificationService } from "@/services/notificationService";

// Escrow event handlers
eventEmitter.on("escrow:created", (data: any) => {
  console.log("Escrow created:", data);
  // Send notification to buyer and seller
  if (data.buyer) {
    notificationService.sendNotification(
      data.buyer,
      "info",
      "Escrow Created",
      `New escrow ${data.id} has been created`
    );
  }
});

eventEmitter.on("escrow:funded", (data: any) => {
  console.log("Escrow funded:", data);
  notificationService.sendNotification(
    data.seller,
    "success",
    "Escrow Funded",
    `Escrow ${data.id} has been funded`
  );
});

eventEmitter.on("escrow:released", (data: any) => {
  console.log("Escrow released:", data);
  notificationService.sendNotification(
    data.seller,
    "success",
    "Funds Released",
    `Funds from escrow ${data.id} have been released`
  );
});

eventEmitter.on("escrow:refunded", (data: any) => {
  console.log("Escrow refunded:", data);
  notificationService.sendNotification(
    data.buyer,
    "info",
    "Escrow Refunded",
    `Escrow ${data.id} has been refunded`
  );
});

eventEmitter.on("escrow:disputed", (data: any) => {
  console.log("Escrow disputed:", data);
  notificationService.sendNotification(
    data.buyer,
    "warning",
    "Escrow Disputed",
    `Escrow ${data.id} is now in dispute`
  );
  notificationService.sendNotification(
    data.seller,
    "warning",
    "Escrow Disputed",
    `Escrow ${data.id} is now in dispute`
  );
});

// Split event handlers
eventEmitter.on("split:created", (data: any) => {
  console.log("Split created:", data);
  notificationService.sendNotification(
    data.owner,
    "success",
    "Split Created",
    `New split ${data.id} has been created`
  );
});

eventEmitter.on("split:distributed", (data: any) => {
  console.log("Split distributed:", data);
  // Notify all recipients
  data.recipients?.forEach((recipient: any) => {
    notificationService.sendNotification(
      recipient.address,
      "success",
      "Funds Received",
      `You received ${recipient.amount} from split ${data.id}`
    );
  });
});

eventEmitter.on("split:deactivated", (data: any) => {
  console.log("Split deactivated:", data);
  notificationService.sendNotification(
    data.owner,
    "info",
    "Split Deactivated",
    `Split ${data.id} has been deactivated`
  );
});

// Custody event handlers
eventEmitter.on("custody:transfer", (data: any) => {
  console.log("Custody transfer:", data);
  notificationService.sendNotification(
    data.from,
    "info",
    "Transfer Initiated",
    `Transfer of ${data.amount} initiated`
  );
  notificationService.sendNotification(
    data.to,
    "success",
    "Funds Received",
    `You received ${data.amount}`
  );
});

export { eventEmitter };

