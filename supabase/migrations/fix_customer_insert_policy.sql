CREATE POLICY \
Customers
can
insert
own
data\ ON customers FOR INSERT WITH CHECK (auth.uid() = id);
