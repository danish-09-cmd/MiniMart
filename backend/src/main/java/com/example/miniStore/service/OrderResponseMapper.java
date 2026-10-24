package com.example.miniStore.service;

import com.example.miniStore.dto.response.AddressSnapshotResponse;
import com.example.miniStore.dto.response.OrderItemResponse;
import com.example.miniStore.dto.response.OrderResponse;
import com.example.miniStore.entity.Address;
import com.example.miniStore.entity.CustomerOrder;
import com.example.miniStore.entity.OrderAddressSnapshot;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class OrderResponseMapper {

    public OrderResponse toResponse(CustomerOrder order) {
        AddressSnapshotResponse address = toAddressResponse(order);
        var items = order.getItems().stream().map(item -> {
            var product = item.getProduct();
            BigDecimal lineTotal = item.getPriceAtPurchase().multiply(BigDecimal.valueOf(item.getQuantity()));
            return new OrderItemResponse(product.getId(), product.getName(), product.getImageUrl(),
                    item.getQuantity(), item.getPriceAtPurchase(), lineTotal);
        }).toList();

        return new OrderResponse(order.getId(), order.getCreatedAt(), order.getTotalAmount(), order.getStatus(),
                order.getPaymentStatus(), order.getPaymentMethod(), address, items,
                order.getUser().getId(), order.getUser().getName(), order.getUser().getEmail());
    }

    private AddressSnapshotResponse toAddressResponse(CustomerOrder order) {
        OrderAddressSnapshot snapshot = order.getAddressSnapshot();
        if (snapshot != null) {
            return new AddressSnapshotResponse(snapshot.getFullName(), snapshot.getPhone(), snapshot.getLine1(),
                    snapshot.getLine2(), snapshot.getCity(), snapshot.getState(), snapshot.getPincode());
        }

        Address address = order.getAddress();
        return new AddressSnapshotResponse(address.getFullName(), address.getPhone(), address.getLine1(),
                address.getLine2(), address.getCity(), address.getState(), address.getPincode());
    }
}
